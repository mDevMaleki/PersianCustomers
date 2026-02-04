using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PersianCustomers.Core.Application.Common.Interfaces;
using PersianCustomers.Core.Application.Common.Models;
using PersianCustomers.Core.Domain.Entities;
using PersianCustomers.Infra.Persistence.Context;


namespace PersianCustomers.Infra.Persistence.Repositories;

public class GenericRepositoryAdvanced<T> : IGenericRepository<T> where T : BaseEntity
{
    private readonly ApplicationDbContext _context;
    private readonly DbSet<T> _dbSet;
    private readonly IUserContextService _userContext;

    public GenericRepositoryAdvanced(ApplicationDbContext context, IUserContextService userContext)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _dbSet = context.Set<T>();
        _userContext = userContext;

    }

    public async Task<T?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<T?> GetByIdAsync(long id, params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;
        query = includes.Aggregate(query, (current, include) => current.Include(include));
        return await query.FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        await _dbSet.ToListAsync(cancellationToken);
        var query = _dbSet.AsQueryable();
        return ApplyAccessFilter(query);

       
    }

    public async Task<IEnumerable<T>> GetAllAsync(params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        // افزودن includes
        query = includes.Aggregate(query, (current, include) => current.Include(include));

        // اعمال فیلتر دسترسی
        query = ApplyAccessFilter(query);

        return await query.ToListAsync();
    }

    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(predicate, cancellationToken);
    }

    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;
        query = includes.Aggregate(query, (current, include) => current.Include(include));
        return await query.FirstOrDefaultAsync(predicate);
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(predicate);
        query = ApplyAccessFilter(query);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet.Where(predicate);

        // اضافه کردن includes
        query = includes.Aggregate(query, (current, include) => current.Include(include));

        // اضافه کردن فیلتر دسترسی
        query = ApplyAccessFilter(query);

        return await query.ToListAsync();
    }

    public async Task<PaginatedResult<T>> GetPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var totalCount = await _dbSet.CountAsync(cancellationToken);
        var items = await _dbSet
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedResult<T>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<PaginatedResult<T>> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? predicate = null,
        Expression<Func<T, object>>? orderBy = null, bool ascending = true, params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        // Apply includes
        query = includes.Aggregate(query, (current, include) => current.Include(include));

        // Apply predicate
        if (predicate != null)
            query = query.Where(predicate);

        var totalCount = await query.CountAsync();

        // Apply ordering
        if (orderBy != null)
        {
            query = ascending ? query.OrderBy(orderBy) : query.OrderByDescending(orderBy);
        }
        else
        {
            query = query.OrderByDescending(e => e.CreateDate);
        }

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<T>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.CountAsync(cancellationToken);
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.CountAsync(predicate, cancellationToken);
    }

    public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(predicate, cancellationToken);
    }

    public async Task<bool> ExistsAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.CreateDate = DateTime.UtcNow;
        var result = await _dbSet.AddAsync(entity, cancellationToken);
        return result.Entity;
    }

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        foreach (var entity in entities)
        {
            entity.CreateDate = DateTime.UtcNow;
        }
        await _dbSet.AddRangeAsync(entities, cancellationToken);
    }

    public void Update(T entity)
    {
        entity.UpdateDate = DateTime.UtcNow;
        _dbSet.Update(entity);
       
    }

    public async Task<T> UpdateAsync(T entity)
    {
        entity.UpdateDate = DateTime.UtcNow;
        _dbSet.Update(entity);
        
        return await Task.FromResult(entity);
    }

    public void UpdateRange(IEnumerable<T> entities)
    {
        foreach (var entity in entities)
        {
            entity.UpdateDate = DateTime.UtcNow;
        }
        _dbSet.UpdateRange(entities);
    }

    public void Remove(T entity)
    {
        _dbSet.Remove(entity);
    }

    public void RemoveRange(IEnumerable<T> entities)
    {
        _dbSet.RemoveRange(entities);
    }

    public async Task RemoveAsync(long id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            Remove(entity);
        }
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var entity = await GetByIdAsync(id);
        if (entity == null)
            return false;

        Remove(entity);
        return true;
    }

    public async Task<int> SaveChangesAsync()
    {
        return  await _context.SaveChangesAsync();
    }

    public IQueryable<T> Query()
    {
        return _dbSet.AsQueryable();
    }

    public async Task<IQueryable<T>> GetAllQueryableAsync()
    {
        return ApplyAccessFilter(_dbSet.AsQueryable());
    }

    public async Task<int> BulkUpdateAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, T>> updateExpression, CancellationToken cancellationToken = default)
    {
        var entities = await _dbSet.Where(predicate).ToListAsync(cancellationToken);
        foreach (var entity in entities)
        {
            var updateFunc = updateExpression.Compile();
            var updatedEntity = updateFunc(entity);
            _context.Entry(entity).CurrentValues.SetValues(updatedEntity);
            entity.UpdateDate = DateTime.UtcNow;
        }
        return entities.Count;
    }

    public async Task<int> BulkDeleteAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var entities = await _dbSet.Where(predicate).ToListAsync(cancellationToken);
        _dbSet.RemoveRange(entities);
        return entities.Count;
    }

    public async Task<IEnumerable<TResult>> SelectAsync<TResult>(Expression<Func<T, TResult>> selector, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Select(selector).ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<TResult>> SelectAsync<TResult>(Expression<Func<T, bool>> predicate, Expression<Func<T, TResult>> selector, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(predicate).Select(selector).ToListAsync(cancellationToken);
    }

    public async Task<decimal> SumAsync(Expression<Func<T, decimal>> selector, CancellationToken cancellationToken = default)
    {
        return await _dbSet.SumAsync(selector, cancellationToken);
    }

    public async Task<decimal?> SumAsync(Expression<Func<T, decimal?>> selector, CancellationToken cancellationToken = default)
    {
        return await _dbSet.SumAsync(selector, cancellationToken);
    }

    public async Task<double> AverageAsync(Expression<Func<T, int>> selector, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AverageAsync(selector, cancellationToken);
    }

    public async Task<TResult?> MaxAsync<TResult>(Expression<Func<T, TResult>> selector, CancellationToken cancellationToken = default)
    {
        return await _dbSet.MaxAsync(selector, cancellationToken);
    }

    public async Task<TResult?> MinAsync<TResult>(Expression<Func<T, TResult>> selector, CancellationToken cancellationToken = default)
    {
        return await _dbSet.MinAsync(selector, cancellationToken);
    }
    private IQueryable<T> ApplyAccessFilter(IQueryable<T> query)
    {
        if (_userContext == null)
            return query;

        var role = _userContext.GetRole();
        var clubId = _userContext.GetClubId();
        var branchId = _userContext.GetBranchId();

        // اگر نقش مشخص نیست یا Manager هست → بدون فیلتر
        if (string.IsNullOrEmpty(role) || role.Equals("SystemManager", StringComparison.OrdinalIgnoreCase))
            return query;

        // اگر نقش AdminClub هست → فیلتر بر اساس ClubId
        if (role.Equals("AdminClub", StringComparison.OrdinalIgnoreCase) &&
            clubId.HasValue && typeof(T).GetProperty("ClubId") != null)
        {
            query = query.Where(e => EF.Property<long>(e, "ClubId") == clubId.Value);
        }

        // اگر نقش UserBranch هست → فیلتر بر اساس BranchId
        if (role.Equals("BranchUser", StringComparison.OrdinalIgnoreCase) && branchId.HasValue)
        {
            if (typeof(T).GetProperty("BranchId") != null)
            {
                query = query.Where(e => EF.Property<long?>(e, "BranchId") == branchId.Value);
            }
            else if (typeof(T).Name == "Branch")
            {
                query = query.Where(e => EF.Property<long>(e, "Id") == branchId.Value);
            }
        }

        // اگر Entity فیلد MemberId دارد → فیلتر اضافه بر اساس Member
        //if (typeof(T).GetProperty("MemberId") != null && clubId.HasValue)
        //{
        //    query = query.Where(e =>
        //        EF.Property<long?>(e, "MemberId") != null &&
        //        _context.Set<Member>()
        //            .Any(m => m.Id == EF.Property<long>(e, "MemberId") &&
        //                      m.ClubId == clubId.Value &&
        //                      (role.Equals("BranchUser", StringComparison.OrdinalIgnoreCase)
        //                           ? m.BranchId == branchId.Value
        //                           : true)));
        //}

        return query;
    }

}