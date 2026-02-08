using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Domain.Entities;
using PersianCustomers.Infra.Persistence.Context;


using static System.Reflection.Metadata.BlobBuilder;

namespace PersianCustomers.Infra.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly IUserContextService _userContext;
    private IDbContextTransaction? _transaction;
    private readonly Dictionary<Type, object> _repositories = new();
    private bool _disposed;

    // Lazy initialization of repositories
    private IGenericRepository<Campaign>? _campaigns;
    private IGenericRepository<Client>? _clients;
   



    public UnitOfWork(ApplicationDbContext context, IUserContextService userContext)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _userContext = userContext;
       
    }

    public IGenericRepository<T> Repository<T>() where T : BaseEntity
    {
        var type = typeof(T);
        if (_repositories.ContainsKey(type))
        {
            return (IGenericRepository<T>)_repositories[type];
        }

        var repository = new GenericRepositoryAdvanced<T>(_context,_userContext) as IGenericRepository<T>;
        if (repository != null)
        {
            _repositories[type] = repository;
        }

        return repository ?? throw new InvalidOperationException($"Repository for {type.Name} could not be created.");
    }

    public IGenericRepository<Campaign> Campaigns =>
        _campaigns ??= new GenericRepositoryAdvanced<Campaign>(_context, _userContext);

    public IGenericRepository<Client> Clients =>
        _clients ??= new GenericRepositoryAdvanced<Client>(_context, _userContext);


    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
  
      
        
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _context.SaveChangesAsync(cancellationToken);
            return result > 0;
        }
        catch (DbUpdateConcurrencyException)
        {
            // Handle concurrency conflicts
            throw;
        }
        catch (DbUpdateException)
        {
            // Handle database update errors
            throw;
        }
    }

    public async Task BeginTransactionAsync()
    {
        if (_transaction != null)
        {
            throw new InvalidOperationException("Transaction already started.");
        }

        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaction == null)
        {
            throw new InvalidOperationException("No transaction started.");
        }

        try
        {
            await _context.SaveChangesAsync();
            await _transaction.CommitAsync();
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction == null) return;

        try
        {
            await _transaction.RollbackAsync();
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
        _disposed = true;
    }
}
